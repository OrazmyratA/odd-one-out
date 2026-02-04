import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { QrService } from '../../services/qr.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-student',
  templateUrl: './student.html',
  styleUrls: ['./student.css'],
  standalone: false
})
export class StudentComponent implements OnInit {
  studentNumber: number = 0;
  message: string = '';
  isOdd: boolean = false;
  gameId: string = '';
  totalStudents: number = 0;
  oddCount: number = 0;
  
  hasError: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private gameService: GameService,
    private qrService: QrService,
    private route: ActivatedRoute
  ) { }
  
// In student.component.ts, update the processParams method or ngOnInit

ngOnInit(): void {
  console.log('=== DEBUG URL ===');
  console.log('Full URL:', window.location.href);
  console.log('Hash:', window.location.hash);
  console.log('Search:', window.location.search);
  
  // Extract params from hash if they exist
  const hash = window.location.hash;
  let params = {};
  
  if (hash.includes('?')) {
    // Extract from hash: #/student?game=...
    const queryString = hash.split('?')[1];
    const urlParams = new URLSearchParams(queryString);
    params = {
      game: urlParams.get('game'),
      total: urlParams.get('total'),
      odd: urlParams.get('odd'),
      msg: urlParams.get('msg'),
      assign: urlParams.get('assign')
    };
    console.log('Params from hash:', params);
  } else {
    // Try regular query params
    params = this.route.snapshot.queryParams;
    console.log('Params from query:', params);
  }
  
  this.processParams(params);
}
  
  private processParams(params: any): void {
    try {
      console.log('=== STUDENT LOADING ===');
      
      // Extract URL parameters
      this.gameId = params['game'] || '';
      this.totalStudents = parseInt(params['total']) || 0;
      this.oddCount = parseInt(params['odd']) || 0;
      const encodedMessage = params['msg'] || '';
      const assignment = params['assign'] || '';
      
      console.log(`Game: ${this.gameId}`);
      console.log(`Total students: ${this.totalStudents}, Odd count: ${this.oddCount}`);
      
      // Validate
      if (!this.gameId || !assignment || !encodedMessage) {
        throw new Error('Invalid QR code. Please scan again.');
      }
      
      // Decode message
      this.message = decodeURIComponent(encodedMessage);
      console.log(`Secret message: ${this.message.substring(0, 20)}...`);
      console.log(`Assignment string: ${assignment}`);
      
      // Get or assign student number
      this.studentNumber = this.getOrAssignStudentNumber();
      console.log(`Student number: ${this.studentNumber}`);
      
      // Check if odd one
      if (this.studentNumber <= assignment.length) {
        const assignmentChar = assignment[this.studentNumber - 1];
        this.isOdd = assignmentChar === '1';
        console.log(`Assignment char at position ${this.studentNumber - 1}: ${assignmentChar}`);
        console.log(`Student #${this.studentNumber} is ${this.isOdd ? 'ODD ONE 🎭' : 'REGULAR ✅'}`);
      } else {
        this.isOdd = false;
        console.warn(`Student number exceeds assignment length`);
      }
      
      this.hasError = false;
      
    } catch (error: any) {
      console.error('Student error:', error);
      this.hasError = true;
      this.errorMessage = error.message;
    }
  }
  
  private getOrAssignStudentNumber(): number {
    // Use sessionStorage to remember this device's student number
    const storageKey = `student_${this.gameId}`;
    const storedNumber = sessionStorage.getItem(storageKey);
    
    if (storedNumber) {
      // Already assigned
      const number = parseInt(storedNumber);
      console.log(`Using existing student #${number} from sessionStorage`);
      return number;
    } else {
      // Need to assign new number
      // For now, let's simulate by counting devices that have this game
      let maxNumber = 0;
      
      // Count devices with this game in sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('student_')) {
          // Extract game ID from key (student_game_12345 -> game_12345)
          const storedGameId = key.replace('student_', '');
          if (storedGameId === this.gameId) {
            maxNumber++;
          }
        }
      }
      
      const newNumber = maxNumber + 1;
      sessionStorage.setItem(storageKey, newNumber.toString());
      console.log(`Assigned new student #${newNumber}`);
      
      // Try to notify teacher (but this won't work cross-device)
      this.notifyTeacher(newNumber);
      
      return newNumber;
    }
  }
  
  private notifyTeacher(studentNumber: number): void {
    // Note: This won't actually work across devices because localStorage is per-origin
    // But we're keeping it for the structure
    
    console.log(`Student #${studentNumber} joined game ${this.gameId}`);
    
    // In a real app, you'd need a backend or WebSockets for this
    // For now, we'll just log it
  }
  
  refresh(): void {
    window.location.reload();
  }
  
  shareGame(): void {
    const shareText = `Join the Odd One Out game! Scan the QR code from the teacher.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Odd One Out Game',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          alert('Game invitation copied!');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
        });
    }
  }
}