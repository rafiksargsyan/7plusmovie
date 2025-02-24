import { JSX, useEffect, useRef } from 'react'
export default function AdsterraBanner(): JSX.Element {
    const banner = useRef<HTMLDivElement>(null)

    const atOptions = {
        key: '65485502e263f33728c73d35f0a0a5ac',
        format: 'iframe',
        height: 90,
        width: 728,
        params: {},
    }
    useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
        const conf = document.createElement('script')
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = `//www.highperformancedformats.com/${atOptions.key}/invoke.js`
        conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`

        banner.current.append(conf)
        banner.current.append(script)
    }
}, [banner])

    return <div ref={banner}></div>
}