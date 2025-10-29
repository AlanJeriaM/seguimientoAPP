import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-submit-modal',
  templateUrl: './confirm-submit-modal.component.html'
})
export class ConfirmSubmitModalComponent {
  @Input() visible: boolean = false;
  @Input() loading: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  handleCancel(): void {
    this.onCancel.emit();
    this.updateVisibility(false);
  }

  handleConfirm(): void {
    this.onConfirm.emit();
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
