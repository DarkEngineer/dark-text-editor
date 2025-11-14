import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TextEditorComponent } from './dark-text-editor';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';


describe('TextEditorComponent', () => {
  let component: TextEditorComponent;
  let fixture: ComponentFixture<TextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextEditorComponent],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        MatToolbarModule,
        MatButtonModule,
        MatInputModule,
        MatCardModule
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse valid JSON into model', () => {
    const testJson = [
      { type: 'paragraph', content: 'Test content' }
    ];

    component.form.get('jsonText')?.setValue(JSON.stringify(testJson));
    component.form.get('jsonText')?.updateValueAndValidity();

    expect(component.documentJson.length).toBe(1);
    expect(component.documentJson[0].type).toBe('paragraph');
  });

  it('should add a new paragraph block', () => {
    const initialLength = component.documentJson.length;
    component.addBlock('paragraph');
    expect(component.documentJson.length).toBe(initialLength + 1);
    expect(component.documentJson.at(-1)?.type).toBe('paragraph');
  });

  it('should remove a block', () => {
    component.addBlock('paragraph');
    const initialLength = component.documentJson.length;

    component.removeBlock(0);

    expect(component.documentJson.length).toBe(initialLength - 1);
  });

  it('should generate HTML preview safely', () => {
    component.documentJson = [
      { type: 'heading', content: 'Hello', level: 2 }
    ];

    component.updateRenderedHtml();

    expect(component.renderedHtml).toBeTruthy();
  });
});

