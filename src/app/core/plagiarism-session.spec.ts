import { TestBed } from '@angular/core/testing';

import { PlagiarismSessionService } from './plagiarism-session';

describe('PlagiarismSessionService', () => {
  let service: PlagiarismSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlagiarismSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
