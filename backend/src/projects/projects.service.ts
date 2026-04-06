import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private model: Model<ProjectDocument>) {}

  async create(buildingId: string, userId: string, data: Partial<Project>) {
    return this.model.create({
      ...data,
      buildingId: new Types.ObjectId(buildingId),
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findByBuilding(buildingId: string) {
    return this.model
      .find({ buildingId: new Types.ObjectId(buildingId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, data: Partial<Project>) {
    const project = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
