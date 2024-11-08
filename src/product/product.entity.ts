import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Order } from '../order/order.entity'; 

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  stock: number;

  @Column({ nullable: true })
  image: string;

  @ManyToMany(() => Order, (order) => order.products)
  orders: Order[]; 
}
