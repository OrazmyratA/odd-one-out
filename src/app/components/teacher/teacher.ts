import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../../services/game.service';
import { QrService } from '../../services/qr.service';
import { GameConfig } from '../../models/game.model';

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.html',
  styleUrls: ['./teacher.css'],
  standalone: false
})
export class TeacherComponent implements OnInit, OnDestroy {
// Handle QR code image errors
onQrCodeError(event: any): void {
  console.error('QR Code image failed to load:', event);
  
  // Try alternative QR code generation
  if (this.currentGame) {
    // Create a simple data URL as fallback
    const qrData = this.currentGame.qrCodeUrl;
    const text = `Scan with camera or visit:\n${qrData}`;
    
    // Create a canvas with the text as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, 150, 100 + (i * 20));
      });
      
      this.qrCodeDataUrl = canvas.toDataURL('image/png');
    }
  }
}
  message: string = 'ELEPHANT';
  totalStudents: number = 15;
  oddCount: number = 3;
  
  currentGame: GameConfig | null = null;
  qrCodeDataUrl: string = '';
  assignedStudents: number = 0;
  oddOnesAssigned: number = 0;
  
  private updateInterval: any;
  private lastStudentCount: number = 0;
  
  constructor(
    private gameService: GameService,
    private qrService: QrService
  ) { }
  
// Add to class properties
private broadcastChannel: any;

// Add to ngOnInit()
ngOnInit(): void {
  // Check if there's an existing game
  this.currentGame = this.gameService.getCurrentGame();
  if (this.currentGame) {
    this.loadGame();
  }
  
  // Start periodic updates
  this.updateInterval = setInterval(() => {
    this.updateStats();
  }, 2000);
  
  // Listen for student notifications
  this.setupStudentNotifications();
}

// Add new method
private setupStudentNotifications(): void {
  if ((window as any).BroadcastChannel) {
    try {
      this.broadcastChannel = new BroadcastChannel('odd_one_out_channel');
      this.broadcastChannel.onmessage = (event: any) => {
        if (event.data && event.data.type === 'student_joined') {
          console.log('Received student join notification:', event.data);
          // Force update stats
          this.updateStats(true);
        }
      };
      console.log('BroadcastChannel listener setup');
    } catch (e) {
      console.log('BroadcastChannel not available');
    }
  }
  
  // Also listen for storage events
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('notify_') && this.currentGame) {
      console.log('Storage event detected from student');
      this.updateStats(true);
    }
  });
}

// Don't forget to clean up in ngOnDestroy
ngOnDestroy(): void {
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
  }
  if (this.broadcastChannel) {
    this.broadcastChannel.close();
  }
}
  
  // Generate new game
async generateGame(): Promise<void> {
  if (!this.validateInputs()) {
    return;
  }
  
  // Create game
  this.currentGame = this.gameService.createGame(
    this.message,
    this.totalStudents,
    this.oddCount
  );
  
  console.log('Generating QR code for game:', this.currentGame.gameId);
  
  // Generate QR code
  this.qrCodeDataUrl = await this.qrService.generateQRCode(this.currentGame);
  
  console.log('QR Code Data URL received:', this.qrCodeDataUrl ? 'YES' : 'NO');
  
  if (!this.qrCodeDataUrl) {
    alert('Failed to generate QR code. Please try again.');
    return;
  }
  
  // Clear previous game stats
  this.clearGameStats();
  
  // Force immediate stats update
  this.updateStats(true);
}
  
  // Reset game
  resetGame(): void {
    if (this.currentGame) {
      // Clear localStorage for this game
      localStorage.removeItem(`game_${this.currentGame.gameId}_assignments`);
      localStorage.removeItem(`game_${this.currentGame.gameId}_student_count`);
    }
    
    this.gameService.resetGame();
    this.currentGame = null;
    this.qrCodeDataUrl = '';
    this.assignedStudents = 0;
    this.oddOnesAssigned = 0;
    this.lastStudentCount = 0;
  }
  
  // Load existing game
  private async loadGame(): Promise<void> {
    if (!this.currentGame) return;
    
    // Regenerate QR code
    this.qrCodeDataUrl = await this.qrService.generateQRCode(this.currentGame);
    
    // Load stats
    this.updateStats(true);
  }
  
  // Update statistics with force option
private updateStats(forceUpdate: boolean = false): void {
  if (!this.currentGame) return;
  
  const newCount = this.gameService.getAssignedStudentCount(this.currentGame.gameId);
  
  console.log(`updateStats called: newCount=${newCount}, lastCount=${this.lastStudentCount}, force=${forceUpdate}`);
  
  // Only update if count changed or forced
  if (forceUpdate || newCount !== this.lastStudentCount) {
    this.assignedStudents = newCount;
    this.lastStudentCount = newCount;
    
    console.log(`Count updated to: ${this.assignedStudents}`);
    
    // Calculate odd ones assigned
    if (this.currentGame && this.assignedStudents > 0) {
      let oddCount = 0;
      const assignment = this.currentGame.assignment;
      console.log(`Assignment string: ${assignment}, length: ${assignment.length}`);
      
      for (let i = 0; i < Math.min(this.assignedStudents, assignment.length); i++) {
        if (assignment[i] === '1') {
          oddCount++;
          console.log(`Student #${i + 1} is an odd one`);
        }
      }
      this.oddOnesAssigned = oddCount;
      console.log(`Total odd ones assigned: ${this.oddOnesAssigned}`);
    }
  }
}
  
  // Clear game stats from localStorage
  private clearGameStats(): void {
    if (!this.currentGame) return;
    
    localStorage.removeItem(`game_${this.currentGame.gameId}_assignments`);
    localStorage.removeItem(`game_${this.currentGame.gameId}_student_count`);
    this.assignedStudents = 0;
    this.oddOnesAssigned = 0;
    this.lastStudentCount = 0;
  }
  
  // Validate inputs
  private validateInputs(): boolean {
    if (!this.message || this.message.trim().length === 0) {
      alert('Please enter a secret message');
      return false;
    }
    
    if (this.totalStudents < 2) {
      alert('Class must have at least 2 students');
      return false;
    }
    
    if (this.oddCount < 1) {
      alert('There must be at least 1 odd one');
      return false;
    }
    
    if (this.oddCount >= this.totalStudents) {
      alert('Odd ones must be fewer than total students');
      return false;
    }
    
    return true;
  }
  
  // Copy URL to clipboard
  copyUrlToClipboard(): void {
    if (!this.currentGame?.qrCodeUrl) {
      alert('No game URL available');
      return;
    }
    
    navigator.clipboard.writeText(this.currentGame.qrCodeUrl)
      .then(() => {
        alert('URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = this.currentGame!.qrCodeUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('URL copied to clipboard!');
      });
  }
  
  // Manually refresh stats
  refreshStats(): void {
    this.updateStats(true);
  }

    // Get current time for display
  getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
// Clear localStorage for current game
clearLocalStorage(): void {
  if (!this.currentGame) return;
  
  const storageKey = `game_${this.currentGame.gameId}_assignments`;
  const countKey = `game_${this.currentGame.gameId}_student_count`;
  
  localStorage.removeItem(storageKey);
  localStorage.removeItem(countKey);
  
  this.assignedStudents = 0;
  this.oddOnesAssigned = 0;
  this.lastStudentCount = 0;
  
  console.log('Cleared localStorage for game:', this.currentGame.gameId);
  alert('LocalStorage cleared!');
}
  // Debug method to check localStorage
// Debug method to check localStorage
// Debug method to check localStorage
// Debug method to check localStorage
debugLocalStorage(): void {
  if (!this.currentGame) {
    console.log('No current game');
    return;
  }
  
  console.log('=== DEBUG LOCALSTORAGE ===');
  console.log('Game ID:', this.currentGame.gameId);
  console.log('Game Assignment:', this.currentGame.assignment);
  console.log('Total Students:', this.currentGame.totalStudents);
  console.log('Odd Count:', this.currentGame.oddCount);
  
  // CORRECT KEY: teacher_game_game_xxx
  const storageKey = `teacher_game_${this.currentGame.gameId}`;
  
  console.log('Storage Key:', storageKey);
  
  const gameDataStr = localStorage.getItem(storageKey);
  
  console.log('Game Data String:', gameDataStr ? gameDataStr.substring(0, 100) + '...' : 'null');
  
  try {
    if (gameDataStr) {
      const gameData = JSON.parse(gameDataStr);
      console.log('Parsed Game Data:', gameData);
      console.log('Student Counter:', gameData.studentCounter);
      console.log('Number of assignments:', Object.keys(gameData.assignments || {}).length);
    }
  } catch (e) {
    console.log('Could not parse game data:', e);
  }
  
  console.log('--- All localStorage items ---');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
    }
  }
  
  console.log('Current counter in UI:', this.assignedStudents);
  console.log('Teacher sees odd ones:', this.oddOnesAssigned);
  console.log('========================');
}
// Test localStorage directly
// Test localStorage directly
testLocalStorage(): void {
  console.log('=== TEST LOCALSTORAGE ===');
  
  // Test if localStorage works
  const testKey = 'test_' + Date.now();
  const testValue = 'test_value_' + Math.random();
  
  localStorage.setItem(testKey, testValue);
  const retrieved = localStorage.getItem(testKey);
  
  console.log('Test key:', testKey);
  console.log('Test value stored:', testValue);
  console.log('Test value retrieved:', retrieved);
  console.log('Match?:', testValue === retrieved);
  
  // Clean up
  localStorage.removeItem(testKey);
  
  // List all items
  console.log('Total localStorage items:', localStorage.length);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      console.log(`  [${i}] ${key}`);
    }
  }
  
  console.log('========================');
}
// Clear all localStorage for debugging
clearAllStorage(): void {
  if (confirm('Clear ALL localStorage? This will reset ALL games.')) {
    localStorage.clear();
    console.log('All localStorage cleared');
    this.assignedStudents = 0;
    this.oddOnesAssigned = 0;
    this.lastStudentCount = 0;
    alert('All storage cleared!');
  }
}
// Add this to teacher.component.ts
testQRGeneration(): void {
  console.log('=== TEST QR GENERATION ===');
  console.log('Current message:', this.message);
  console.log('Current totalStudents:', this.totalStudents);
  console.log('Current oddCount:', this.oddCount);
  console.log('Current game exists:', !!this.currentGame);
  console.log('QR Code Data URL exists:', !!this.qrCodeDataUrl);
  
  if (this.currentGame) {
    console.log('Game ID:', this.currentGame.gameId);
    console.log('QR Code URL:', this.currentGame.qrCodeUrl);
  }
  
  // Test generating a simple QR
  const testUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=HelloWorld&choe=UTF-8';
  console.log('Test QR URL:', testUrl);
  
  // Create test image
  const testImg = new Image();
  testImg.onload = () => console.log('Test QR loads successfully');
  testImg.onerror = () => console.log('Test QR failed to load');
  testImg.src = testUrl;
}
}