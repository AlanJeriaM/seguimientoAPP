import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-save-progress-modal',
  templateUrl: './save-progress-modal.component.html'
})
export class SaveProgressModalComponent {
  @Input() visible: boolean = false;
  @Input() progress: number = 0;
  @Input() saving: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSaveAndExit = new EventEmitter<void>();
  @Output() onExitWithoutSaving = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  handleSaveAndExit(): void {
    this.onSaveAndExit.emit();
  }

  handleExitWithoutSaving(): void {
    this.onExitWithoutSaving.emit();
    this.updateVisibility(false);
  }

  handleHide(): void {
    this.updateVisibility(false);
    this.onCancel.emit();
  }

  private updateVisibility(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }
}
