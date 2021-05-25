import React, { useEffect, useState } from "react"
import * as S from "./styled"
import { Button } from "gatsby-theme-material-ui"
import { GeneralDataProtectionRegulationHandler } from "../../config/gdpr-handler"

export default function GDPRConsent() {
  // States
  const [open, setOpen] = useState(false)
  // Actions
  const handleAcceptOnClick = () => {
    GeneralDataProtectionRegulationHandler.cookieConsentAccepted()
    setOpen(false)
  }
  const handleDeclineOnClick = () => {
    GeneralDataProtectionRegulationHandler.cookieConsentDeclined()
    setOpen(false)
  }
  useEffect(() => {
    if (GeneralDataProtectionRegulationHandler.userHasntBeenAsked()) {
      setOpen(true)
    }
  }, [])
  // Snackbar setup
  const snackbarAction = (
    <>
      <Button color="primary" size="small" onClick={handleAcceptOnClick}>
        Accept
      </Button>
      <Button color="inherit" size="small" onClick={handleDeclineOnClick}>
        Decline
      </Button>
    </>
  )
  const message = `This website stores cookies 🍪 on your computer only if you allow them. 
  I use them to understand 🕵 your browsing experience and for analytics and metrics about our visitors on this website.
  If you'd like to collaborate and help me 🤝 improve my blog, please click on the accept button 😍.`

  return <S.CustomSnackbar data-testid="gdpr-consent-snackbar" open={open} message={message} action={snackbarAction} />
}
