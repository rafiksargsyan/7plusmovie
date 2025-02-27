import { JSX, useEffect, useRef } from 'react'

export default function AdsterraNativeBanner(): JSX.Element {
    const banner = useRef<HTMLDivElement>(null)
    useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
        const div = document.createElement('div')
        const script = document.createElement('script')
        script.async = true
        script.src = `//pl25728000.effectiveratecpm.com/896becda8e20a6d0e0feb77cc7e72f11/invoke.js`
        script.setAttribute('data-cfasync', 'false')
        div.id = "container-896becda8e20a6d0e0feb77cc7e72f11"
        
        banner.current.append(div)
        banner.current.append(script)
    }
}, [banner])

    return <div ref={banner}></div>
}