import Link from "next/link";
import Header from "../components/header";
import fetch from 'isomorphic-unfetch';
import apiUrl from '../utils/api-url';
import styled from '@emotion/styled';

const ServiceItems = styled.div`
display: flex;
`

const ServiceItem = styled.a`
cursor: pointer;
display: block;
padding: 1.5rem;
border: 1px solid #efefef;
`

const Index = (props) => {
  return (
    <main>
      <Header />
      <section>
        <ServiceItems>
          {props.services.map((service) => {
            return (
              <Link  href="/service/[name]" as={`/service/${service.service}`} key={service.service}>
                <ServiceItem>
                  { service.service }
                </ServiceItem>
              </Link>
            )
          })}
        </ServiceItems>
      </section>
    </main>
  );
}

Index.getInitialProps = async (env) => {
  const res = await fetch(env.apiHost, {
    method: 'POST',
    body: JSON.stringify({
      'i': 'ok',
      'action': 'services'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return {
    services: await res.json()
  }
}

export default Index;
