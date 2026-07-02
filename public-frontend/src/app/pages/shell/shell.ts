import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NoiseMapComponent } from '../../components/noise-map/noise-map';
import { AudioMapModalComponent } from '../../components/audio-map-modal/audio-map-modal';
import { AudioPlayerComponent } from '../../components/audio-player/audio-player';
import { AuthService } from '../../services/auth.service';
import { AudioService } from '../../services/audio.service';
import { Audio } from '../../models/audio.model';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, NoiseMapComponent, AudioMapModalComponent, AudioPlayerComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private audioService = inject(AudioService);

  readonly mostrarMapaRuido = signal(true);
  readonly vistaLista = signal(false);
  readonly currentUser = this.auth.user;
  readonly selectedAudio = signal<Audio | null>(null);

  private readonly _audios = signal<Audio[]>([]);

  readonly sortedAudios = computed(() =>
    [...this._audios()].sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
  );

  ngOnInit(): void {
    this.audioService.getAudios().subscribe({
      next: (audios) => this._audios.set(audios),
      error: (err) => console.error('Error al cargar audios:', err),
    });
  }

  toggleMapaRuido(): void {
    this.mostrarMapaRuido.set(!this.mostrarMapaRuido());
  }

  openMapModal(audio: Audio): void {
    this.selectedAudio.set(audio);
  }

  closeMapModal(): void {
    this.selectedAudio.set(null);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  displayName(): string {
    const u = this.currentUser();
    if (!u) return '';
    return u.name || u.username || u.email || 'Usuario';
  }

  userInitial(): string {
    return this.displayName().charAt(0).toUpperCase() || 'U';
  }

  roleLabel(): string {
    const role = this.currentUser()?.role;
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  intensityColor(dB: number): string {
    const i = Math.max(0, Math.min(dB / 100, 1));
    if (i >= 0.8) return '#ef4444';
    if (i >= 0.5) return '#f59e0b';
    return '#10b981';
  }
}
