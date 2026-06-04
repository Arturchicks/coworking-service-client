// ESLint Flat Config — современный формат конфигурации ESLint (с v9, 2024).
// Один файл `eslint.config.{js,ts,mjs}` в корне (вместо каскада .eslintrc).
// Экспортирует массив объектов: каждый — «слой» правил, последний переопределяет предыдущие.
// Цена миграции со старого формата: нетривиальная. Польза: предсказуемость, ESM-first.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import stylistic from '@stylistic/eslint-plugin'


export default [
	{
		ignores: ['**/dist/**', '**/node_modules/**', '**/.vite/**', 'frontend/dist/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['frontend/**/*.{ts,tsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
		},
		languageOptions: {
			ecmaVersion: 2022,
			parserOptions: {
				ecmaFeatures: {jsx: true},
			},
		},
		settings: {
			react: {version: 'detect'},
		},
		rules: {
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react-hooks/exhaustive-deps': 'warn',
			'react-hooks/rules-of-hooks': 'error',
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		plugins: {
			import: importPlugin,
			'@stylistic': stylistic,
		},
		languageOptions: {
			ecmaVersion: 2022,
		},
		rules: {
			'no-console': 'off',
			'no-duplicate-imports': 'warn',
			'no-undef': 'off',
			'prefer-const': 'warn',

			'import/newline-after-import': ['warn', {count: 2, exactCount: false, considerComments: true}],
			'import/order': ['warn',
				{
					groups: ['external', 'internal', 'parent', 'sibling', 'index'],
					pathGroups: [
						{pattern: 'react', group: 'external', position: 'before'},
						{pattern: '@/shared/**', group: 'internal', position: 'before'},
						{pattern: '@/entities/**', group: 'internal', position: 'after'},
						{pattern: '@/features/**', group: 'internal', position: 'after'},
						{pattern: '@/widgets/**', group: 'internal', position: 'after'},
						{pattern: '@/pages/**', group: 'internal', position: 'after'},
					],
					pathGroupsExcludedImportTypes: ['react'],
				},
			],

			// КРИТИЧЕСКОЕ ПРАВИЛО для backend DDD-границ — кодификация архитектурных
			// на ревью; здесь ESLint ловит нарушение ДО коммита.
			//
			// Семантика zones: {target, from} — ЗАПРЕЩЕНО target импортировать из from.
			// Это enforce'ит "Imports flow strictly inward: interface → application → domain".
			'import/no-restricted-paths': ['error', {
				zones: [
					// DDD: domain не знает ни о ком
					{target: './api/src/domain', from: './api/src/application'},
					{target: './api/src/domain', from: './api/src/infrastructure'},
					{target: './api/src/domain', from: './api/src/interface'},
					// application использует domain — не infrastructure и не interface.
					{target: './api/src/application', from: './api/src/infrastructure'},
					{target: './api/src/application', from: './api/src/interface'},
					// infrastructure реализует доменные порты — не импортирует interface.
					{target: './api/src/infrastructure', from: './api/src/interface'},
				],
			}],

			// Стилистика — НЕ корректность, только форма. Современная норма: prettier + ESLint без стилистики.
			// Здесь выбран подход «всё в ESLint» — цена в скорости lint'а; польза — один источник правил.
			'@stylistic/comma-dangle': ['warn', 'always-multiline'],
			'@stylistic/indent': ['warn', 'tab', {SwitchCase: 1}],
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/semi': ['warn', 'never'],
			'@stylistic/object-curly-spacing': ['warn', 'never'],

			'@typescript-eslint/explicit-function-return-type': 'off',
			// argsIgnorePattern: '^_' — параметры с подчёркиванием игнорируются как "явно неиспользуемые".
			// Типичный приём для Express-middleware (req, res, next) где не всё используется.
			'@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
		},
	},
]
