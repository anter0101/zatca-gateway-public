import { Injectable, Logger } from '@nestjs/common';
import { UserSeederService } from './user/user-seeder.service';

@Injectable()
export class Seeder {
  constructor(
    private readonly logger: Logger,
    private readonly userSeederService: UserSeederService,
  ) {}
  async seed() {
    // Seed Users
    await this.users()
      .then(() => {
        this.logger.debug('Successfully completed seeding users...');
        return true;
      })
      .catch((error) => {
        this.logger.error('Failed seeding users...');
        throw error;
      });
  }

  async users() {
    return await Promise.all(this.userSeederService.create())
      .then((createdUsers) => {
        // Can also use this.logger.verbose('...');
        this.logger.debug(
          'No. of users created : ' +
            // Remove all null values and return only created users.
            createdUsers.filter(
              (nullValueOrCreatedUser) => nullValueOrCreatedUser,
            ).length,
        );
        return true;
      })
      .catch((error) => {
        throw error;
      });
  }
}
