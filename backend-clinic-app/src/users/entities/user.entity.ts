import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users') // Tên bảng sẽ được tạo trong CSDL
export class User {
  
  @PrimaryGeneratedColumn('uuid') // ID tự tăng (kiểu UUID)
  id: string;

  @Column({ unique: true }) // Bắt buộc phải là duy nhất
  email: string;
  

  @Column()
  fullName: string;
  
  // (Lưu ý: không bao giờ lưu password dạng text, hãy hash nó!)
  @Column()
  passwordHash: string; 

  @Column({ nullable: true }) // Cho phép null (không bắt buộc)
  phoneNumber: string;

  @CreateDateColumn() // Tự động điền ngày giờ tạo
  createdAt: Date;
}