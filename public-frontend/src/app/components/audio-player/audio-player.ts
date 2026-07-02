import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-player.html',
  styleUrl: './audio-player.css',
})
export class AudioPlayerComponent {
  @Input({ required: true }) src!: string;
  @ViewChild('audioEl') audioEl!: ElementRef<HTMLAudioElement>;

  readonly playing = signal(false);
  readonly muted = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);

  toggle(): void {
    const el = this.audioEl.nativeElement;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  }

  toggleMute(): void {
    const el = this.audioEl.nativeElement;
    el.muted = !el.muted;
    this.muted.set(el.muted);
  }

  seek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.audioEl.nativeElement.currentTime = value;
    this.currentTime.set(value);
  }

  onTimeUpdate(): void {
    this.currentTime.set(this.audioEl.nativeElement.currentTime);
  }

  onLoadedMetadata(): void {
    this.duration.set(this.audioEl.nativeElement.duration || 0);
  }

  onEnded(): void {
    this.playing.set(false);
    this.currentTime.set(0);
  }

  format(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
