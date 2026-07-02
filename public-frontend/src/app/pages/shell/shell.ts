import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NoiseMapComponent } from '../../components/noise-map/noise-map';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, NoiseMapComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly mostrarMapaRuido = signal(true);
  readonly currentUser = this.auth.user;

  toggleMapaRuido(): void {
    this.mostrarMapaRuido.set(!this.mostrarMapaRuido());
  }

  logout(): void {
    this.auth.logout();
    // El servicio ya redirige a /login; aseguramos la navegación.
    this.router.navigateByUrl('/login');
  }

  displayName(): string {
    const u = this.currentUser();
    if (!u) return '';
    return u.name || u.username || u.email || 'Usuario';
  }

  roleLabel(): string {
    const role = this.currentUser()?.role;
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
}
