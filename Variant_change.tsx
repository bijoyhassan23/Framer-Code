import type { ComponentType } from "react"
import { useState } from "react"

export function withVariantSwitcher(Component): ComponentType {
    return (props) => {
        const [variant, setVariant] = useState("red") // Initial state

        return (
            <Component
                {...props}
                variant={variant} // Set the variant prop
                onClick={() =>
                    setVariant((prevVariant) => {
                        console.log("Previous:", prevVariant)
                        if (prevVariant == "red") {
                            return "blue"
                        } else {
                            return "red"
                        }
                    })
                } // Change variant on click
            />
        )
    }
}