import { NextFunction, Request, Response } from "express"
import { getRepository } from "typeorm"
import { GroupStudent } from "../entity/group-student.entity"
import { CreateGroupStudentInput, UpdateGroupStudentInput } from "../interface/group-student.interface"

export class GroupStudentController {

  private groupStudentRepository = getRepository(GroupStudent)
  async allGroupStudents(request: Request, response: Response, next: NextFunction) {
    return this.groupStudentRepository.find()

  }

  async createGroupStudent(request: Request, response: Response, next: NextFunction) {

    const { body: params } = request

    const createGroupStudentInput: CreateGroupStudentInput = {
      group_id: params.group_id,
      student_id: params.student_id,
      incident_count: params.incident_count

    }
    const groupStudent = new GroupStudent()
    groupStudent.prepareToCreate(createGroupStudentInput)

    return this.groupStudentRepository.save(groupStudent)
  }

  async updateGroupStudent(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    this.groupStudentRepository.findOne(params.id).then((groupStudent) => {
      const updateGroupStudent: UpdateGroupStudentInput = {
        id: params.id,
        group_id: params.group_id,
        student_id: params.student_id,
        incident_count: params.incident_count
      }
      groupStudent.prepareToUpdate(updateGroupStudent)

      return this.groupStudentRepository.save(groupStudent)
    })
  }



  async removeGroupStudent(request: Request, response: Response, next: NextFunction) {
    let groupStudentToRemove = await this.groupStudentRepository.findOne(request.params.id)
    await this.groupStudentRepository.remove(groupStudentToRemove)
  }
}


