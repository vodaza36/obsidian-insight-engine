import { describe, it, expect } from 'vitest';
import { TagFormatter } from '../../../src/services/tagFormatter';
import { InsightEngineSettings } from '../../../src/models/types';

describe('TagFormatter', () => {
	let formatter: TagFormatter;

	describe('Common behavior across all styles', () => {
		const styles = [
			'default',
			'camelCase',
			'PascalCase',
			'snake_case',
			'kebab-case',
			'Train-Case',
			'UPPERCASE',
			'lowercase',
		];

		styles.forEach((style) => {
			describe(`with ${style} style`, () => {
				beforeEach(() => {
					formatter = new TagFormatter(style as any);
				});

				it('should handle empty string', () => {
					expect(formatter.formatTag('')).toBe('');
				});

				it('should not add # prefix by default', () => {
					const result = formatter.formatTag('tag');
					expect(result.startsWith('#')).toBe(false);
				});

				it('should add # prefix when requested', () => {
					const result = formatter.formatTag('tag', true);
					expect(result.startsWith('#')).toBe(true);
				});

				it('should remove existing # prefix', () => {
					const withHash = formatter.formatTag('#tag');
					const withoutHash = formatter.formatTag('tag');
					expect(withHash).toBe(withoutHash);
				});

				it('should handle special characters consistently', () => {
					const withSpecialChars = formatter.formatTag('my@tag!');
					const withSpaces = formatter.formatTag('my tag');
					// Special characters should be treated like spaces
					expect(withSpecialChars).toBe(withSpaces);
				});

				it('should normalize multiple separators', () => {
					const withMultipleSpaces = formatter.formatTag('my  tag');
					const withSingleSpace = formatter.formatTag('my tag');
					expect(withMultipleSpaces).toBe(withSingleSpace);
				});
			});
		});
	});

	describe('Style-specific formatting', () => {
		describe('default style', () => {
			beforeEach(() => {
				formatter = new TagFormatter();
			});

			it('should format with hyphens and lowercase', () => {
				expect(formatter.formatTag('My Cool Tag')).toBe('my-cool-tag');
				expect(formatter.formatTag('MyCoolTag')).toBe('my-cool-tag');
				expect(formatter.formatTag('my_cool_tag')).toBe('my-cool-tag');
				expect(formatter.formatTag('my@cool!tag')).toBe('my-cool-tag');
			});

			it('should format with # prefix when requested', () => {
				expect(formatter.formatTag('My Cool Tag', true)).toBe('#my-cool-tag');
				expect(formatter.formatTag('MyCoolTag', true)).toBe('#my-cool-tag');
			});
		});

		describe('camelCase style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('camelCase');
			});

			it('should format in camelCase', () => {
				expect(formatter.formatTag('hello world')).toBe('helloWorld');
				expect(formatter.formatTag('hello-world')).toBe('helloWorld');
				expect(formatter.formatTag('HELLO_WORLD')).toBe('helloWorld');
				expect(formatter.formatTag('hello@world!')).toBe('helloWorld');
			});

			it('should format in camelCase with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#helloWorld');
			});
		});

		describe('PascalCase style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('PascalCase');
			});

			it('should format in PascalCase', () => {
				expect(formatter.formatTag('hello world')).toBe('HelloWorld');
				expect(formatter.formatTag('hello-world')).toBe('HelloWorld');
				expect(formatter.formatTag('HELLO_WORLD')).toBe('HelloWorld');
				expect(formatter.formatTag('hello@world!')).toBe('HelloWorld');
			});

			it('should format in PascalCase with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#HelloWorld');
			});
		});

		describe('snake_case style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('snake_case');
			});

			it('should format in snake_case', () => {
				expect(formatter.formatTag('hello world')).toBe('hello_world');
				expect(formatter.formatTag('helloWorld')).toBe('hello_world');
				expect(formatter.formatTag('hello-world')).toBe('hello_world');
				expect(formatter.formatTag('hello@world!')).toBe('hello_world');
			});

			it('should format in snake_case with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#hello_world');
			});
		});

		describe('kebab-case style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('kebab-case');
			});

			it('should format in kebab-case', () => {
				expect(formatter.formatTag('hello world')).toBe('hello-world');
				expect(formatter.formatTag('helloWorld')).toBe('hello-world');
				expect(formatter.formatTag('HELLO_WORLD')).toBe('hello-world');
				expect(formatter.formatTag('hello@world!')).toBe('hello-world');
			});

			it('should format in kebab-case with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#hello-world');
			});
		});

		describe('Train-Case style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('Train-Case');
			});

			it('should format in Train-Case', () => {
				expect(formatter.formatTag('hello world')).toBe('Hello-World');
				expect(formatter.formatTag('helloWorld')).toBe('Hello-World');
				expect(formatter.formatTag('hello_world')).toBe('Hello-World');
				expect(formatter.formatTag('hello@world!')).toBe('Hello-World');
			});

			it('should format in Train-Case with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#Hello-World');
			});
		});

		describe('UPPERCASE style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('UPPERCASE');
			});

			it('should format in UPPERCASE with underscores', () => {
				expect(formatter.formatTag('hello world')).toBe('HELLO_WORLD');
				expect(formatter.formatTag('helloWorld')).toBe('HELLO_WORLD');
				expect(formatter.formatTag('hello-world')).toBe('HELLO_WORLD');
				expect(formatter.formatTag('hello@world!')).toBe('HELLO_WORLD');
			});

			it('should format in UPPERCASE with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#HELLO_WORLD');
			});
		});

		describe('lowercase style', () => {
			beforeEach(() => {
				formatter = new TagFormatter('lowercase');
			});

			it('should format in lowercase with underscores', () => {
				expect(formatter.formatTag('hello world')).toBe('hello_world');
				expect(formatter.formatTag('HelloWorld')).toBe('hello_world');
				expect(formatter.formatTag('HELLO-WORLD')).toBe('hello_world');
				expect(formatter.formatTag('hello@world!')).toBe('hello_world');
			});

			it('should format in lowercase with # when requested', () => {
				expect(formatter.formatTag('hello world', true)).toBe('#hello_world');
			});
		});
	});
});
