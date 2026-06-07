import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  keyframes,
} from '@angular/animations';
import { ApiService, HealthResponse } from '../../services/api.service';

@Component({
  selector: 'app-api-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-tester.component.html',
  styleUrl: './api-tester.component.css',
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        query(
          '.animate-in',
          [
            style({ opacity: 0, transform: 'translateY(24px)' }),
            stagger(70, [
              animate(
                '550ms cubic-bezier(0.22, 1, 0.36, 1)',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('panel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(0.98)' }),
        animate(
          '420ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '220ms ease-in',
          style({ opacity: 0, transform: 'translateY(-8px) scale(0.98)' })
        ),
      ]),
    ]),
    trigger('shake', [
      transition(':enter', [
        animate(
          '600ms ease-out',
          keyframes([
            style({ transform: 'translateX(0)', offset: 0 }),
            style({ transform: 'translateX(-10px)', offset: 0.15 }),
            style({ transform: 'translateX(10px)', offset: 0.3 }),
            style({ transform: 'translateX(-6px)', offset: 0.45 }),
            style({ transform: 'translateX(6px)', offset: 0.6 }),
            style({ transform: 'translateX(0)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
})
export class ApiTesterComponent implements OnInit {
  readonly defaultImageUrl =
    'https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/p-blog/candy.JPG';

  question = 'What animal is on the candy?';
  modelId = 'google/gemma-4-31B-it';
  audioModelId = 'google/gemma-4-E2B-it';

  useImageFile = false;
  useImageUrl = true;
  imageUrl = this.defaultImageUrl;
  imageFile: File | null = null;
  imagePreview: string | null = null;

  useAudioFile = false;
  useAudioUrl = false;
  audioUrl = '';
  audioFile: File | null = null;
  audioPreviewUrl: string | null = null;

  health = signal<HealthResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<string | null>(null);
  pageReady = signal(false);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    requestAnimationFrame(() => this.pageReady.set(true));
    this.api.health().subscribe({
      next: (h) => {
        this.health.set(h);
        if (h.model_id) {
          this.modelId = h.model_id;
        }
      },
      error: (err) => this.error.set(this.formatError(err)),
    });
  }

  setModelForImages(): void {
    this.modelId = 'google/gemma-4-31B-it';
  }

  setModelForAudio(): void {
    this.modelId = this.audioModelId;
  }

  onImageFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageFile = file;
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = file ? URL.createObjectURL(file) : null;
  }

  onAudioFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.audioFile = file;
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
    }
    this.audioPreviewUrl = file ? URL.createObjectURL(file) : null;
    if (file) {
      this.modelId = this.audioModelId;
    }
  }

  submit(): void {
    this.error.set(null);
    this.result.set(null);

    if (!this.question.trim()) {
      this.error.set('Enter a question.');
      return;
    }

    const hasImage =
      (this.useImageFile && this.imageFile) ||
      (this.useImageUrl && this.imageUrl.trim());
    const hasAudio =
      (this.useAudioFile && this.audioFile) ||
      (this.useAudioUrl && this.audioUrl.trim());

    if (!hasImage && !hasAudio) {
      this.error.set('Provide an image and/or audio input.');
      return;
    }

    const form = new FormData();
    form.append('question', this.question.trim());
    form.append('model', this.modelId.trim());

    if (this.useImageFile && this.imageFile) {
      form.append('image', this.imageFile, this.imageFile.name);
    } else if (this.useImageUrl && this.imageUrl.trim()) {
      form.append('image_url', this.imageUrl.trim());
    }

    if (this.useAudioFile && this.audioFile) {
      form.append('audio', this.audioFile, this.audioFile.name);
    } else if (this.useAudioUrl && this.audioUrl.trim()) {
      form.append('audio_url', this.audioUrl.trim());
    }

    this.loading.set(true);
    this.api.ask(form).subscribe({
      next: (res) => {
        this.result.set(res.result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.formatError(err));
        this.loading.set(false);
      },
    });
  }

  private formatError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const e = err as { error?: { detail?: string }; message?: string };
      if (typeof e.error === 'object' && e.error?.detail) {
        return String(e.error.detail);
      }
      if (typeof e.error === 'string') {
        return e.error;
      }
      if (e.message) {
        return e.message;
      }
    }
    return 'Request failed. Is the API running on port 8000?';
  }
}
