import { NextFunction, Request, Response } from "express"
import { Between, getConnection, getRepository } from "typeorm"
import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"
import { GroupStudent } from "../entity/group-student.entity"
import { Roll } from "../entity/roll.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
var subWeeks = require('date-fns/subWeeks')
import { CreateGroupStudentInput } from "../interface/group-student.interface"
import { format, compareAsc } from 'date-fns'
export const BeforeDate = (date: Date, weeks: Number) => Between(subWeeks(date, weeks), date);

export class GroupController {
  //  private connection = await createConnection()

  private groupRepository = getRepository(Group)
  private groupStudentRepository = getRepository(GroupStudent)
  private rollRepository = getRepository(Roll)
  private studentRollStateRepository = getRepository(StudentRollState)
  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1: 

    // Return the list of all groups
    return this.groupRepository.find()


  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 

    // Add a Group

    const { body: params } = request
    const createGroupInput: CreateGroupInput = {
      name: params.name,
      number_of_weeks: params.number_of_weeks,
      roll_states: params.roll_states.join(","),
      incidents: params.incidents,
      ltmt: params.ltmt
    }
    const group = new Group()
    group.prepareToCreate(createGroupInput)

    return this.groupRepository.save(group)
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 

    // Update a Group


    const { body: params } = request

    this.groupRepository.findOne(params.id).then((group) => {
      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.incidents,
        run_at: params.run_at,
        student_count: params.student_count
      }
      group.prepareToUpdate(updateGroupInput)

      return this.groupRepository.save(group)
    })
  }


  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 

    // Delete a Group

    let groupToRemove = await this.groupRepository.findOne(request.params.id)
    await this.groupRepository.remove(groupToRemove)
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1: 

    // Return the list of Students that are in a Group
    return this.groupStudentRepository.find()
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
    const { body: params } = request

    await this.groupStudentRepository.createQueryBuilder().delete().execute()
    let groups = await this.groupRepository.find();
    for (let i = 0; i < groups.length; i++) {

      const createGroupInput: CreateGroupInput = {
        name: groups[i].name,
        number_of_weeks: groups[i].number_of_weeks,
        roll_states: groups[i].roll_states,
        incidents: groups[i].incidents,
        ltmt: groups[i].ltmt
      }
      var result = await this.exeGroupFilterQuery(createGroupInput)

      const updateGroupInput: UpdateGroupInput = {
        id: groups[i].id,
        name: groups[i].name,
        number_of_weeks: groups[i].number_of_weeks,
        roll_states: groups[i].roll_states,
        incidents: groups[i].incidents,
        ltmt: groups[i].ltmt,
        run_at: new Date(),
        student_count: result.length
      }
      let group = new Group()
      group.prepareToUpdate(updateGroupInput)
      await this.groupRepository.save(group)

      for (let j = 0; j < result.length; j++) {

        const createStudentRollStateInput: CreateGroupStudentInput = {
          group_id: groups[i].id,
          student_id: result[j].srs_student_id,
          incident_count: result[j].student_incident_count
        }
        await this.groupStudentRepository.save(createStudentRollStateInput);

      }
    }

    return await this.groupStudentRepository.find()
  }


  async exeGroupFilterQuery(params) {
    var condition;
    if (params.ltmt === ">") {
      condition = 's.student_incident_count >= :incident_count'
    } else {
      condition = 's.student_incident_count <= :incident_count'
    }
    var today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (params.number_of_weeks * 7));

    let query = await this.studentRollStateRepository.createQueryBuilder()
      .select("s.srs_student_id").addSelect("s.student_incident_count")
      .from(subQuery => {
        return subQuery.select('srs.student_id')
          .addSelect("count(srs.state)", "student_incident_count")
          .innerJoin("roll", "roll", "srs.roll_id = roll.id")
          .where('roll.completed_at >= :startDate', { startDate: format(lastWeek, "yyyy-MM-dd") })
          .andWhere('roll.completed_at <= :endDate', { endDate: format(today, "yyyy-MM-dd") })
          .andWhere('srs.state in (:...states)', {
            states: params.roll_states.split(",")
          })
          .groupBy("srs.student_id")
          .from(StudentRollState, "srs")

      }, "s")
      .where(condition, { ltmt: params.ltmt, incident_count: params.incidents })
      .groupBy('s.srs_student_id')
    return await query.getRawMany()
  }
}

