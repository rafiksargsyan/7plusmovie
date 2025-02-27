import { JSX, useEffect, useRef } from 'react'

interface AdsterraBannerProps {
  adKey: string;
  height: number;
  width: number;  
}

export default function AdsterraBanner(props: AdsterraBannerProps): JSX.Element {
    const banner = useRef<HTMLDivElement>(null)

    const atOptions = {
        key: props.adKey,
        format: 'iframe',
        height: props.height,
        width: props.width,
        params: {},
    }
    useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
        const conf = document.createElement('script')
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = `//www.highperformanceformat.com/${atOptions.key}/invoke.js`
        conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`

        banner.current.append(conf)
        banner.current.append(script)
    }
}, [banner])

    return <div ref={banner}></div>
}