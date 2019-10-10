import { useState } from "react";
import Link from "next/link";
import Header from "../../components/header";
import util from 'util'
import fetch from 'isomorphic-unfetch';
import apiUrl from '../../utils/api-url';
import { useRouter } from 'next/router';
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant"
import { useAsync } from "react-async-hook"

import { css, Global } from '@emotion/core';

import styled from '@emotion/styled';

const Input = styled.input`
padding: 12px 8px;
`

const ItemHolder = styled.div`
background-color: ${props => props.odd ? '#efefef' : '#dfdfdf'};
cursor: pointer;
`

const ItemTitle = styled.div`
padding: 0 0.75rem;
height: 35px;
display: flex;
align-items: center;
`

const VariationHolder = styled.div`
display: flex;
align-items: center;
`

const ComputeInstance = ({variation}) => {
  const attr = variation.attributes
  return (
    <div style={{ fontSize: 12 }}>
      <div>ECU {attr.ecu}</div>
      <div>vCPU {attr.vcpu}</div>
      <div>RAM {attr.memory}</div>
    </div>
  )
}

const VariationComponents = {
  "compute instance": ComputeInstance,
  "compute instance (bare metal)": ComputeInstance,
}

const Variation = ({product, variation}) => {
  const Component = VariationComponents[variation.productFamily.toLowerCase()]
  if (Component) {
    return <VariationHolder><Component variation={variation} /></VariationHolder>
  } else {
    return (
      <VariationHolder>
        <div style={{ fontSize: 12, textAlign: 'center', width: '100%' }}>unsupported {variation.productFamily.toLowerCase()}</div>
      </VariationHolder>
    )
  }
  
}

const Row = (serviceCode, products) => ({ index, style }) => {
  const product = products[index]

  const router = useRouter();

  const push = () => {
    router.push(`/product/[serviceCode]/[type]`, `/product/${serviceCode}/${product.type}`)
  }

  return (
    <div style={style}>
      <ItemHolder odd={index % 2 === 0} onClick={push}>
        <ItemTitle>{ product.type } ({ product.variations.length } variations)</ItemTitle>
        <div style={{height: 75, padding: '0 0.75rem'}}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                className="List"
                height={height}
                itemCount={product.variations.length}
                itemSize={200}
                width={width}
                layout="horizontal"
              >
                {RowVariation(product)}
              </List>
            )}
          </AutoSizer>
        </div>
      </ItemHolder>
      <div></div>
    </div>
  )
}

const RowVariation = (product) => ({ index, style }) => {
  const variation = product.variations[index]
  const Component = VariationComponents[variation.productFamily.toLowerCase()]
  return (
    <div style={style}>
      <div style={{ padding: '0.75rem 0' }}>
        <Variation product={product} variation={variation} />
      </div>
    </div>
  )
}

const useSearch = (products) => {
  const [searchText, setSearchText] = useState('');

  const doFilter = async (text) => {
    return products.filter((p) => {
      return p.search.indexOf(text) !== -1
    })
  }

  const debouncedSearch = useConstant(() =>
    AwesomeDebouncePromise(doFilter, 1000)
  );

  const search = useAsync(
    async text => {
      if (text.length === 0) {
        return products;
      } else {
        return debouncedSearch(text);
      }
    },
    [searchText]
  );

  return {
    searchText,
    setSearchText,
    search
  };
};

const Service = (props) => {
  const {searchText, setSearchText, search} = useSearch(props.products);

  let content = null

  if (!search.result) {
    content = (<div>filtering with 😎...</div>)
  } else {
    content = (
      <div style={{height: '1000px'}}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              className="List"
              height={height}
              itemCount={search.result.length}
              itemSize={/* title */35 + /* slider */75}
              width={width}
            >
              {Row(props.serviceCode, search.result)}
            </List>
          )}
        </AutoSizer>
      </div>
    )
  }

  return (
    <main>
      <Header />
      <section>
        <div style={{ paddingBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
          <div>
            <Input type="text" placeholder="Search by code" onChange={(evt) => setSearchText(evt.target.value)} />
          </div>
          <div style={{ marginLeft: '0.75rem' }}>{search.result && search.result.length} items</div>
        </div>
        {content}
      </section>
    </main>
  );
}

Service.getInitialProps = async (env) => {
  const response = await fetch(env.apiHost, {
    method: 'POST',
    body: JSON.stringify({
      'i': 'ok',
      'action': 'products',
      'params': {
        'code': env.query.name
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const products = await response.json()

  return {
      serviceCode: env.query.name,
      products
  }
}

export default Service;
