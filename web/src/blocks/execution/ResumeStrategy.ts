import { Block } from '../base';

export class ResumeStrategy extends Block {
  readonly type = 'resume_strategy';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;
}
