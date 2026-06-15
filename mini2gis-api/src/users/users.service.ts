import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async create(email: string, password: string, role: UserRole = 'user') {
    const exists = await this.findByEmail(email);
    if (exists) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(password, 10);
    return this.repo.save(this.repo.create({ email, password: hash, role }));
  }
}
