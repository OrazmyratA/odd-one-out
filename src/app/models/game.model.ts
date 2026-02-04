export interface GameConfig {
  message: string;
  totalStudents: number;
  oddCount: number;
  gameId: string;
  assignment: string; // Binary string like "0101001"
  qrCodeUrl: string;
  createdAt: Date;
}

export interface StudentAssignment {
  gameId: string;
  studentNumber: number;
  isOdd: boolean;
  message: string;
  deviceId: string;
}