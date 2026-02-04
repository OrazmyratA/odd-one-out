import { Injectable } from '@angular/core';
import { GameConfig } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  
  constructor() { }
  
  // Generate QR code using Google Charts API (no library needed)
// Alternative QR code generator
async generateQRCode(gameConfig: GameConfig): Promise<string> {
  try {
    const qrData = this.buildStudentUrl(gameConfig);
    gameConfig.qrCodeUrl = qrData;
    
    // Try multiple services
    const services = [
      // Service 1: QR Server
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`,
      // Service 2: GoQR
      `http://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=300x300`,
      // Service 3: QuickChart
      `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=300`,
    ];
    
    // Return first service URL
    return services[0];
    
  } catch (err) {
    console.error('QR Code error:', err);
    
    // Ultimate fallback: Create text-based "QR"
    const qrData = this.buildStudentUrl(gameConfig);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN ME', 150, 140);
      ctx.font = '12px Arial';
      ctx.fillText('Odd One Out Game', 150, 170);
      return canvas.toDataURL('image/png');
    }
    
    return '';
  }
}
  
  // Build student URL with all parameters
  private buildStudentUrl(gameConfig: GameConfig): string {
    const baseUrl = window.location.origin + '/student';
    
    // Create URL parameters
    const params = new URLSearchParams({
      game: gameConfig.gameId,
      total: gameConfig.totalStudents.toString(),
      odd: gameConfig.oddCount.toString(),
      msg: encodeURIComponent(gameConfig.message),
      assign: gameConfig.assignment
    });
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log('Built student URL:', fullUrl);
    return fullUrl;
  }
  
  // Parse URL parameters
  parseUrlParams(): any {
    const params = new URLSearchParams(window.location.search);
    
    return {
      gameId: params.get('game'),
      totalStudents: parseInt(params.get('total') || '0'),
      oddCount: parseInt(params.get('odd') || '0'),
      message: decodeURIComponent(params.get('msg') || ''),
      assignment: params.get('assign') || ''
    };
  }
}