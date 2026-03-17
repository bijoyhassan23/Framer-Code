import { useRef } from "react"
import { forwardRef, type ComponentType } from "react"

export function withFormSend(Component): ComponentType {
    return forwardRef((props, ref) => {
        function setRefs(node) {
            formSendFun(node.closest("form"))
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        }
        return <Component ref={setRefs} {...props} />
    })
}

function formSendFun(formInstance) {
    formInstance.addEventListener("submit", async function (e) {
        e.preventDefault()

        const formData = new FormData(formInstance)
        const getErrorMessage = document.querySelector("#error_message > p");
        const payload = {
            sName: formData.get("sName"),
            sEmail: formData.get("sEmail"),
            sMobile: formData.get("sMobile"),
            iRole: parseInt(formData.get("iRole")) || 0,
        }

        try {
            const response = await fetch(
                "https://api.paperless.tax/users/account/signupac2",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            )

            const result = await response.json()

            // If success and redirect exists
            if (response.ok && result.sRedirect && isValidUrl(result.sRedirect)) {
                console.log("Send Success Full")
                console.log(result)
                window.location.href = result.sRedirect;
            } else {
                if (result?.sMessage) {
                    getErrorMessage.textContent = result.sMessage
                }else if (result?.sRedirect) {
                    getErrorMessage.textContent = result.sRedirect
                }else{
                    getErrorMessage.textContent = "An error occurred. Please try again."
                }
                getErrorMessage.setAttribute("show_status", "true");
            }
        } catch (error) {
            console.error("Error:", error)
            getErrorMessage.textContent = "An error occurred. Please try again."
            getErrorMessage.setAttribute("show_status", "true");
        }
    })
}

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (err) {
    return false;
  }
}