import * as bcrypt from 'bcrypt';

export async function transformPassword(user: {
  password?: string;
}): Promise<void> {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  return Promise.resolve();
}
