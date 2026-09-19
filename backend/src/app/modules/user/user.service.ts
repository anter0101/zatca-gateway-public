import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { UserDTO } from './dtos/user.dto';
import { transformPassword } from 'src/core/security';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<UserDTO | undefined> {
    const result = await this.userRepository.findOne({ where: { id } });
    return result || undefined;
  }

  async findByFields(
    options: FindOneOptions<UpdateUserDTO>,
  ): Promise<UserDTO | undefined> {
    const result = await this.userRepository.findOne(options);
    return result || undefined;
  }

  async find(
    options: FindManyOptions<UpdateUserDTO>,
  ): Promise<UserDTO | undefined> {
    const result = await this.userRepository.findOne(options);
    return result || undefined;
  }

  async findAndCount(
    options: FindManyOptions<UserDTO>,
  ): Promise<[UserDTO[], number]> {
    const resultList = await this.userRepository.findAndCount(options);
    return resultList;
  }

  async save(
    userDTO: UpdateUserDTO,
    creator?: string,
    updatePassword = false,
  ): Promise<UserDTO> {
    if (updatePassword) {
      await transformPassword(userDTO);
    }
    if (creator) {
      if (!userDTO.createdBy) {
        userDTO.createdBy = creator;
      }
      userDTO.updatedBy = creator;
    }
    const result = await this.userRepository.save(userDTO);
    return result;
  }

  async update(
    userDTO: UpdateUserDTO,
    updater?: string,
  ): Promise<UpdateUserDTO> {
    if (updater) {
      userDTO.updatedBy = updater;
    }
    if (userDTO.password) {
      await transformPassword(userDTO);
    }
    await this.userRepository.update(
      {
        id: userDTO.id,
      },
      userDTO,
    );
    return userDTO;
  }

  async delete(userDTO: UserDTO): Promise<UserDTO | undefined> {
    const result = await this.userRepository.remove(userDTO);
    return result;
  }
}
