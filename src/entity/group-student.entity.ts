import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { CreateGroupStudentInput, UpdateGroupStudentInput } from "../interface/group-student.interface"

@Entity()
export class GroupStudent {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  student_id: number

  @Column()
  group_id: number

  @Column()
  incident_count: number

  public prepareToUpdate(input: UpdateGroupStudentInput) {

    if (input.group_id !== undefined) this.group_id = input.group_id
    if (input.student_id !== undefined) this.student_id = input.student_id
    if (input.incident_count !== undefined) this.incident_count = input.incident_count

  }

  public prepareToCreate(input: CreateGroupStudentInput) {
    if (input.group_id !== undefined) this.group_id = input.group_id
    if (input.student_id !== undefined) this.student_id = input.student_id
    if (input.incident_count !== undefined) this.incident_count = input.incident_count
  }


}
