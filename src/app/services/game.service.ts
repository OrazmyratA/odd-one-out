import { Injectable } from '@angular/core';
import { GameConfig } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private currentGame: GameConfig | null = null;
  
  constructor() { }
  
  // Create a new game
  createGame(message: string, totalStudents: number, oddCount: number): GameConfig {
    const gameId = this.generateGameId();
    const assignment = this.generateAssignment(totalStudents, oddCount);
    
    this.currentGame = {
      message,
      totalStudents,
      oddCount,
      gameId,
      assignment,
      qrCodeUrl: '',
      createdAt: new Date()
    };
    
    console.log('Created new game:', gameId, 'Assignment:', assignment);
    
    // Store game in teacher's localStorage
    this.storeGameInTeacherStorage();
    
    return this.currentGame;
  }
  
  // Store game in teacher's localStorage
  private storeGameInTeacherStorage(): void {
    if (!this.currentGame) return;
    
    const gameData = {
      gameId: this.currentGame.gameId,
      assignment: this.currentGame.assignment,
      totalStudents: this.currentGame.totalStudents,
      oddCount: this.currentGame.oddCount,
      message: this.currentGame.message,
      studentCounter: 0, // Start at 0
      assignments: {} as { [key: string]: number }
    };
    
    const storageKey = `teacher_game_${this.currentGame.gameId}`;
    localStorage.setItem(storageKey, JSON.stringify(gameData));
    console.log('Game stored in teacher localStorage with key:', storageKey);
  }
  
  // Get game from teacher's localStorage
  private getGameFromTeacherStorage(gameId: string): any {
    const storageKey = `teacher_game_${gameId}`;
    const data = localStorage.getItem(storageKey);
    
    if (data) {
      console.log(`Found game data for key: ${storageKey}`);
      return JSON.parse(data);
    } else {
      console.log(`No game data found for key: ${storageKey}`);
      return null;
    }
  }
  
  // Update student counter in teacher's localStorage
  incrementStudentCounter(gameId: string): number {
    const gameData = this.getGameFromTeacherStorage(gameId);
    if (!gameData) {
      console.log('No game data found for:', gameId);
      return 0;
    }
    
    gameData.studentCounter++;
    const storageKey = `teacher_game_${gameId}`;
    localStorage.setItem(storageKey, JSON.stringify(gameData));
    
    console.log(`Student counter incremented to: ${gameData.studentCounter} for game ${gameId}`);
    return gameData.studentCounter;
  }
  
  // Generate binary assignment string
  private generateAssignment(total: number, oddCount: number): string {
    if (oddCount > total) {
      oddCount = total - 1;
    }
    
    const arr = new Array(total).fill('0');
    const indices: number[] = [];
    
    while (indices.length < oddCount) {
      const idx = Math.floor(Math.random() * total);
      if (!indices.includes(idx)) {
        indices.push(idx);
        arr[idx] = '1';
      }
    }
    
    return arr.join('');
  }
  
  private generateGameId(): string {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  getCurrentGame(): GameConfig | null {
    return this.currentGame;
  }
  
  resetGame(): void {
    this.currentGame = null;
  }
  
  // Get assigned student count from teacher's storage
  getAssignedStudentCount(gameId: string): number {
    const gameData = this.getGameFromTeacherStorage(gameId);
    
    if (gameData) {
      console.log(`getAssignedStudentCount: ${gameData.studentCounter} for game ${gameId}`);
      return gameData.studentCounter;
    } else {
      console.log(`No game data found for getAssignedStudentCount: ${gameId}`);
      return 0;
    }
  }
  
  // Check if student is odd one
  isStudentOdd(gameConfig: GameConfig, studentNumber: number): boolean {
    if (studentNumber < 1 || studentNumber > gameConfig.assignment.length) {
      return false;
    }
    return gameConfig.assignment[studentNumber - 1] === '1';
  }
  
  // Get all assignments for a game
  getAllAssignments(gameId: string): { [key: string]: number } {
    const gameData = this.getGameFromTeacherStorage(gameId);
    return gameData ? gameData.assignments : {};
  }
}