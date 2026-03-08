import { createContext, useContext, useEffect, useRef, useState } from "react"
import { forwardRef, type ComponentType } from "react"

type FormState = "mail" | "otp" | "mail error" | "otp error"

type FormVariationContextType = {
    currentFormState: FormState
    setCurrentFormState: (value: FormState) => void
}

declare global {
    interface Window {
        sMail?: string
    }
}

const FormVariationContext = createContext<FormVariationContextType | null>(
    null
)
const mailBoundForms = new WeakSet<HTMLFormElement>()
const otpBoundForms = new WeakSet<HTMLFormElement>()

// Higher-Order Component to provide form variation context
export function withFormVariationSwitcher(Component): ComponentType {
    return forwardRef((props, ref) => {
        const [currentFormState, setCurrentFormState] =
            useState<FormState>("mail")

        function setRefs(node: HTMLElement | null) {
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return (
            <FormVariationContext.Provider
                value={{ currentFormState, setCurrentFormState }}
            >
                <Component
                    ref={setRefs}
                    {...props}
                    variant={currentFormState}
                />
            </FormVariationContext.Provider>
        )
    })
}

// Higher-Order Component to handle form submission
export function withMailSend(Component): ComponentType {
    return forwardRef((props, ref) => {
        const context = useContext(FormVariationContext)
        const setCurrentFormState = context?.setCurrentFormState ?? (() => undefined)
        const currentFormState = context?.currentFormState ?? "mail"
        const formRef = useRef<HTMLFormElement | null>(null)

        useEffect(() => {
            const formInstance = formRef.current
            if (!formInstance) return

            const shouldDisable =
                currentFormState === "otp" || currentFormState === "otp error"

            formInstance.querySelectorAll("input, button").forEach((el) => {
                if (
                    el instanceof HTMLInputElement ||
                    el instanceof HTMLButtonElement
                ) {
                    el.disabled = shouldDisable
                }
            })
        }, [currentFormState])

        function setRefs(node: HTMLElement | null) {
            const formInstance = node?.closest("form") as HTMLFormElement | null
            formRef.current = formInstance
            formMailSendFun({
                formInstance,
                setCurrentFormState,
            })

            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return <Component ref={setRefs} {...props} />
    })
}

function formMailSendFun({
    formInstance,
    setCurrentFormState,
}: {
    formInstance: HTMLFormElement | null
    setCurrentFormState: (value: FormState) => void
}) {
    if (!formInstance || mailBoundForms.has(formInstance)) return

    mailBoundForms.add(formInstance)

    formInstance.addEventListener("submit", (e) => {
        e.preventDefault()
        const formData = new FormData(formInstance)

        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sEmail: formData.get("sEmail") }),
        }
        // Send OTP request
        fetch("https://api.paperless.tax/users/account/sendotp", options)
            .then((response) => response.json())
            .then((result) => {
                if (result?.iStatus != 1) {
                    window.sMail = String(formData.get("sEmail") ?? "")
                    setCurrentFormState("otp")
                } else {
                    setCurrentFormState("mail error")
                }
                console.log(result?.sMessage)
            })
            .catch((error) => {
                console.error("Error:", error)
                setCurrentFormState("mail error")
            })
    })
}

export function withOtpSend(Component): ComponentType {
    return forwardRef((props, ref) => {
        const context = useContext(FormVariationContext)
        const setCurrentFormState =
            context?.setCurrentFormState ?? (() => undefined)

        function setRefs(node: HTMLElement | null) {
            const formInstance = node?.closest("form") as HTMLFormElement | null
            formOtpSendFun({
                formInstance,
                setCurrentFormState,
            })

            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return <Component ref={setRefs} {...props} />
    })
}

function formOtpSendFun({
    formInstance,
    setCurrentFormState,
}: {
    formInstance: HTMLFormElement | null
    setCurrentFormState: (value: FormState) => void
}) {
    if (!formInstance || otpBoundForms.has(formInstance)) return

    otpBoundForms.add(formInstance)

    formInstance.addEventListener("submit", (e) => {
        e.preventDefault()
        const formData = new FormData(formInstance)

        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sEmail: window.sMail,
                sOTP: formData.get("sOTP"),
            }),
        }
        // Send OTP verification request
        fetch("https://api.paperless.tax/users/account/loginweb", options)
            .then((response) => response.json())
            .then((result) => {
                if (result?.iStatus != 1) {
                    console.log(result)
                    if (result?.sURL) window.location.href = result?.sURL
                } else {
                    setCurrentFormState("otp error")
                }
            })
            .catch((error) => {
                console.error("Error:", error)
                setCurrentFormState("otp error")
            })
    })
}