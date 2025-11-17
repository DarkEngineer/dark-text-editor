import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DarkTextEditor } from './dark-text-editor';
import { HeadingBlock } from '../public-api';


describe('TextEditorComponent', () => {
  let component: DarkTextEditor;
  let fixture: ComponentFixture<DarkTextEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DarkTextEditor],
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
    fixture = TestBed.createComponent(DarkTextEditor);
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

    expect(component.form.controls.jsonBlocks.value.length).toBe(1);
    expect(component.form.controls.jsonBlocks.value[0].type).toBe('paragraph');
  });

  /*
  it('should add a new paragraph block', () => {
    const initialLength = component.form.controls.jsonBlocks.value.length;
    component.form.controls.jsonBlocks.setValue('paragraph');
    expect(component.documentJson.length).toBe(initialLength + 1);
    expect(component.documentJson.at(-1)?.type).toBe('paragraph');
  });

  it('should remove a block', () => {
    component.addBlock('paragraph');
    const initialLength = component.documentJson.length;

    component.removeBlock(0);

    expect(component.documentJson.length).toBe(initialLength - 1);
  });
  */

  it('should generate HTML preview safely', () => {
    component.form.controls.jsonBlocks.setValue([
      { type: 'heading', content: 'Hello', level: 2 } as HeadingBlock
    ]);

    component.updateRenderedHtml();

    expect(component.form.controls.renderedHtml.value).toBeTruthy();
  });
});

