'use client'

import { useCallback, useEffect, useState } from "react"

export default function Page() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'admin',
                    password: '123456'
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            console.log('Login success:', data);
            // TODO: 处理登录成功后的逻辑（如保存 token、跳转等）
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    }, [])

    useEffect(() => {
        login()
    }, [login])

    return <>
        <div>login</div>
        {loading && <div>登录中...</div>}
        {error && <div>错误: {error}</div>}
    </>
}