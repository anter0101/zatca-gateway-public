import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { users } from './data';
import { transformPassword } from 'src/core/security';
import { User } from 'src/app/modules/user/user.entity';
import { UserDTO } from 'src/app/modules/user/dtos/user.dto';

/**
 * Service dealing with user based operations.
 *
 * @class
 */
@Injectable()
export class UserSeederService {
  /**
   * Create an instance of class.
   *
   * @constructs
   *
   * @param {Repository<User>} userRepository
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Seed all users.
   *
   * @function
   */
  create(): Array<Promise<User | null>> {
    return users.map(async (user: UserDTO) => {
      return await this.userRepository
        .findOne({ where: { id: user.id } })
        .then(async (dbUser) => {
          // We check if a user already exists.
          // If it does don't create a new one.
          if (dbUser) {
            return Promise.resolve(null);
          }
          await transformPassword(user);
          return Promise.resolve(
            // or create(user).then(() => { ... });
            await this.userRepository.save(user),
          );
        })
        .catch((error) => {
          if (error instanceof Error) {
            return Promise.reject(error);
          }
          return Promise.reject(new Error('Users seeder error'));
        });
    });
  }
}
