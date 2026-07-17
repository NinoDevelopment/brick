import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as mongoose from "mongoose";

import { CreateProjectDto, UpdateProjectDto } from "./dto/gallery.dto";
import { Project } from "./schema/gallery";

@Injectable()
export class GalleryService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const createdProject = new this.projectModel(createProjectDto);
    return createdProject.save();
  }

  async findAllProjects(): Promise<Project[]> {
    return this.projectModel.find().select("-images").exec();
  }

  async findProjectById(projectId: string): Promise<Project | null> {
    return this.projectModel.findById(projectId).select("-images").exec();
  }

  async findProjectImages(projectId: string): Promise<{ images: string[] }> {
    const project = await this.projectModel
      .findById(projectId)
      .select("images")
      .exec();

    if (!project) {
      return { images: [] };
    }

    return { images: project.images ?? [] };
  }

  async updateProject(updateProjectDto: UpdateProjectDto): Promise<Project | null> {
    const project = await this.projectModel.findById(updateProjectDto._id);
    if (!project) throw new NotFoundException("Проект не найден");
    project.name = updateProjectDto.name;
    project.description = updateProjectDto.description;
    project.images = updateProjectDto.images;
    project.show = updateProjectDto.show;
    return project.save();
  }

  async deleteProjects(projectIds: string[]) {
    await this.projectModel
      .deleteMany({ _id: { $in: projectIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .exec();
    return projectIds;
  }
}
