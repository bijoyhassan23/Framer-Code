import type { ComponentType } from "react"
import { useEffect, useState } from "react"

export function withScrollEffect(Component): ComponentType {
    return (props) => {
        const [scrollEffect, setScrollEffect] = useState(false)

        useEffect(() => {
            const onScroll = () => {
                setScrollEffect(window.scrollY > 100)
            }

            onScroll()
            window.addEventListener("scroll", onScroll)

            return () => window.removeEventListener("scroll", onScroll)
        }, [])

        return (
            <Component
                {...props}
                data-scroll-effect={scrollEffect ? "true" : "false"}
            />
        )
    }
}