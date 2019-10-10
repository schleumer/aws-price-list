import Link from "next/link"
import { css, Global } from '@emotion/core';
import styled from '@emotion/styled';

const Header1 = styled.h1`
  font-size: 1.5rem;
  padding: 0 0 1.5rem 0;
  margin: 0;
`

function Header() {
  return (
    <header>
      <Header1>
        <Link href="/">
          <a style={{ textDecoration: 'none', color: '#00f' }}>AWS Price List</a>
        </Link>
      </Header1>
    </header>
  );
}

export default Header;
