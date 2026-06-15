import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('places')
export class Place {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  opening_hours: string;

  @Column({ type: 'float' })
  @Index()
  lat: number;

  @Column({ type: 'float' })
  @Index()
  lng: number;

  @Column({ nullable: true, unique: true })
  osm_id: string;

  @Column({ default: 'osm' })
  source: string;

  @ManyToOne(() => Category, { nullable: true, eager: true })
  category: Category;
}
