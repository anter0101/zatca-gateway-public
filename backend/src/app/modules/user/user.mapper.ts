import { User } from './user.entity';
import { UserDTO } from './dtos/user.dto';
import { BaseDTO } from 'src/core/utils/base.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';

// Define the keys allowed for mapping (subset of UserDTO | BaseDTO)
// Excludes 'password' by default.
const allowedUserDtoKeys: ReadonlyArray<keyof UserDTO | keyof BaseDTO> = [
  'id',
  'createdAt',
  'email',
  'username',
  'activated',
  'imageUrl',
  'role',
];

/**
 * Maps a User entity or an array of User entities to UserDTO objects,
 * allowing selective inclusion of properties based on a predefined allowed list.
 *
 * @param userOrUsers - The User entity or array of User entities to map.
 * @param keys - Optional array of keys (properties) to include in the resulting DTO(s).
 *               Only keys present in the `allowedUserDtoKeys` list will be considered.
 *               If omitted, all keys from `allowedUserDtoKeys` will be mapped.
 * @returns A partial UserDTO or an array of partial UserDTOs containing the selected properties.
 */
export function mapUserToUserDtoSelective(
  user: User,
  keys?: (keyof UserDTO | keyof BaseDTO)[],
): UpdateUserDTO;
export function mapUserToUserDtoSelective(
  users: User[],
  keys?: (keyof UserDTO | keyof BaseDTO)[],
): UpdateUserDTO[];
export function mapUserToUserDtoSelective(
  userOrUsers: User | User[],
  keys?: (keyof UserDTO | keyof BaseDTO)[],
): UpdateUserDTO | UpdateUserDTO[] {
  const mapSingle = (user: User): UpdateUserDTO => {
    const resultDto: UpdateUserDTO = {};

    // Determine keys to map: User-provided keys filtered by allowed keys, or default allowed keys
    const keysToMap = (keys || allowedUserDtoKeys).filter((key) =>
      (allowedUserDtoKeys as Array<keyof UserDTO | keyof BaseDTO>).includes(
        key,
      ),
    );

    keysToMap.forEach((key) => {
      // Check if the key exists on the source User entity object and is not undefined
      // This runtime check is crucial.
      if (key in user && user[key as keyof User] !== undefined) {
        // Assign the value. Casting to 'any' remains the most pragmatic way
        // to handle the dynamic key assignment across potentially different types.
        // The 'key in user' check provides runtime safety.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (resultDto as any)[key] = user[key as keyof User];
      }
    });

    return resultDto;
  };

  if (Array.isArray(userOrUsers)) {
    return userOrUsers.map(mapSingle);
  } else {
    return mapSingle(userOrUsers);
  }
}
