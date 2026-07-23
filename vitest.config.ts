import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        // tsconfig.json의 "@/*": ["./src/*"] 경로 별칭을 네이티브로 인식한다.
        // 이것 없이는 import '@/lib/...' 경로를 못 찾아서 테스트가 실패한다.
        tsconfigPaths: true,
    },
    oxc: {
        // tsconfig.json은 jsx: "preserve"다 (Next.js SWC가 변환 담당).
        // Vite 8의 기본 트랜스포머(oxc)는 이 값을 그대로 물려받아 "preserve"로 두면
        // JSX를 변환하지 않고 그대로 남겨서 tsx 테스트 파일이 파싱에 실패한다.
        // jsx에 객체를 지정해 tsconfig 값 대신 실제 automatic 런타임 변환을 강제한다.
        jsx: { runtime: 'automatic' },
    },
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
    },
})
