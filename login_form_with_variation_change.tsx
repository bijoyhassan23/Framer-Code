import { useRef, createContext, useContext, useState } from "react"
import { forwardRef, type ComponentType } from "react"

const FormVariationContext = createContext(null);

// Higher-Order Component to provide form variation context
export function withFormVariationSwitcher(Component): ComponentType {
    return forwardRef((props, ref) => {
        const [currentFormState, setCurrentFormState] = useState("mail");
        function setRefs(node) {
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return (
            <FormVariationContext.Provider value={{ currentFormState, setCurrentFormState }}>
                <Component ref={setRefs} {...props} variant={currentFormState}/>
            </FormVariationContext.Provider>
        )
    })
}

// Higher-Order Component to handle form submission
export function withMailSend(Component): ComponentType {
    return forwardRef((props, ref) => {
        const { currentFormState, setCurrentFormState } = useContext(FormVariationContext);

        function setRefs(node) {
            formMailSendFun({formInstance: node.closest("form"), currentFormState, setCurrentFormState})
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return (
            <Component ref={setRefs} {...props} />
        )
    })
}

function formMailSendFun({formInstance, currentFormState, setCurrentFormState}) {
    if(formInstance && currentFormState && setCurrentFormState) {
        formInstance.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(formInstance);
            const options = {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({sEmail: formData.get("sEmail")}),
            }
            // Send OTP request
            fetch("https://api.paperless.tax/users/account/sendotp", options)
            .then(response => response.json())
            .then(result => {
                if(result?.iStatus != 1){
                    window.sMail = formData.get("sEmail");
                    setCurrentFormState("otp");
                }else{
                    setCurrentFormState("mail error");
                }
                console.log(result?.sMessage);
            }).catch(error => {
                console.error("Error:", error);
                setCurrentFormState("mail error");
            });
        });
    }
}

export function withOtpSend(Component): ComponentType {
    return forwardRef((props, ref) => {
        const { currentFormState, setCurrentFormState } = useContext(FormVariationContext);

        function setRefs(node) {
            formOtpSendFun({formInstance: node.closest("form"), currentFormState, setCurrentFormState})
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return (
            <Component ref={setRefs} {...props} />
        )
    })
}

function formOtpSendFun({formInstance, currentFormState, setCurrentFormState}){
    formInstance.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(formInstance);
        const options = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({sEmail: window.sMail, sOTP: formData.get("sOTP")}),
        }
        // Send OTP verification request
        fetch("https://api.paperless.tax/users/account/loginweb", options)
        .then(response => response.json())
        .then(result => {
            if(result?.iStatus != 1){
                console.log(result);
                if(result?.sURL) window.location.href = result?.sURL;
            } else {
                setCurrentFormState("otp error");
            }
        }).catch(error => {
            console.error("Error:", error);
            setCurrentFormState("otp error");
        });
    });
}

export function makeFieldReadOnly(Component): ComponentType {
    return forwardRef((props, ref) => {
        function setRefs(node: HTMLElement | null) {
            if (node) {
                const directField =
                    node instanceof HTMLInputElement ||
                    node instanceof HTMLTextAreaElement
                        ? node
                        : null

                const nestedField = node.querySelector("input, textarea")
                const targetField = directField ?? nestedField

                if (targetField) {
                    targetField.readOnly = true
                    targetField.setAttribute("aria-readonly", "true")
                }
            }

            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return (
            <Component ref={setRefs} {...props} />
        )
    })
}