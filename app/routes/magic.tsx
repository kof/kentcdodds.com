import type {LoaderFunction} from 'remix'
import {redirect} from 'remix'
import * as React from 'react'
import {rootStorage, loginSessionWithMagicLink} from '../utils/session.server'

export const loader: LoaderFunction = async ({request}) => {
  const params = new URL(request.url).searchParams
  const mode = params.get('mode')
  const code = params.get('oobCode')
  const continueUrl = params.get('continueUrl')
  const session = await rootStorage.getSession(request.headers.get('Cookie'))
  const email = session.get('email') as string | null

  if (!email || !code || mode !== 'signIn') {
    session.flash('error', 'Sign in link invalid. Please request a new one.')
    return redirect('/login', {
      headers: {'Set-Cookie': await rootStorage.commitSession(session)},
    })
  }

  try {
    await loginSessionWithMagicLink(session, {
      emailAddress: email,
      link: request.url,
    })
    const cookie = await rootStorage.commitSession(session, {maxAge: 604_800})
    return redirect(continueUrl ?? '/me', {
      headers: {'Set-Cookie': cookie},
    })
  } catch (error: unknown) {
    if (error instanceof Error) console.error(error.message)

    session.flash('error', 'Sign in link invalid. Please request a new one.')
    return redirect('/login', {
      headers: {'Set-Cookie': await rootStorage.commitSession(session)},
    })
  }
}

export default function Magic() {
  return (
    <div>
      {`Congrats! You're seeing something you shouldn't ever be able to see because you should have been redirected. Good job!`}
    </div>
  )
}
