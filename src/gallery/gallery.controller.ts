import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { GalleryService } from "./gallery.service";
import {
  CreateProjectDto,
  DeleteProjectsDto,
  UpdateProjectDto,
  FindOneParams,
} from "./dto/gallery.dto";
import { Project } from "./schema/gallery";
import { AuthGuard } from "src/auth/auth.guard";

@Controller("gallery")
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  async findAllProjects(): Promise<Project[]> {
    return this.galleryService.findAllProjects();
  }

  @Get(":id")
  async findProjectById(@Param() param: FindOneParams): Promise<Project> {
    const project = await this.galleryService.findProjectById(param.id);
    if (project === null) throw new NotFoundException("Проект не найден");
    return project;
  }

  @Get("/images/:id")
  async findProjectImages(@Param() param: FindOneParams): Promise<string[]> {
    return this.galleryService.findProjectImages(param.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProject(@Body() createDto: CreateProjectDto): Promise<Project> {
    return this.galleryService.createProject(createDto);
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateProject(@Body() updateDto: UpdateProjectDto): Promise<Project> {
    const project = await this.galleryService.updateProject(updateDto);
    if (!project) throw new NotFoundException("Проект не найден");
    return project;
  }

  @Delete()
  @UseGuards(AuthGuard)
  async deleteProjects(@Body() deleteProjectsDto: DeleteProjectsDto): Promise<DeleteProjectsDto> {
    await this.galleryService.deleteProjects(deleteProjectsDto.projectIds);
    return deleteProjectsDto;
  }
}
