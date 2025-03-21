export interface SectionGeneralProps {
  /**
   * Describes if the form must be disabled
   *  to prevent the user from editing it
   */
  disabled: boolean;
}

export interface ValidationErrorItem {
  [key: string]: ValidationErrorItem | { message: string } | undefined;
}
