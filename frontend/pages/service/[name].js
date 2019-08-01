import Link from "next/link";
import Header from "../../components/header";
import util from 'util'
import fetch from 'isomorphic-unfetch';
import apiUrl from '../../utils/api-url';
import { useRouter } from 'next/router';
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { css, Global } from '@emotion/core';

import styled from '@emotion/styled';

const ItemHolder = styled.div`
background-color: ${props => props.odd ? '#efefef' : '#dfdfdf'};
`

const ItemTitle = styled.div`
padding: 0 0.75rem;
height: 35px;
display: flex;
align-items: center;
`

const VariationHolder = styled.div`
padding: 0 0.75rem;
height: 35px;
display: flex;
align-items: center;
box-shadow: inset 6px 0px 0 -3px #a8a8ff;
padding-left: 10px;
`

const ComputeInstance = ({variation}) => {
  const attr = variation.attributes
  return (
    <div>
      {variation.productFamily} - ECU {attr.ecu} / vCPU {attr.vcpu} / RAM {attr.memory}
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
    return <VariationHolder>unsupported {variation.productFamily.toLowerCase()}</VariationHolder>
  }
  
}

const Index = (props) => {
  const getItemSize = (index) => {
    const product = props.products[index]
    let variations = product.variations

    let len = 0;

    if (variations.length > 5) {
      len = 5
      variations = variations.slice(0, 4)
    } else {
      len = variations.length
    }
    
    return 35 + (len * 35)
  };

  const Row = ({ index, style }) => {
    const product = props.products[index]

    return (
      <div style={style}>
        <ItemHolder odd={index % 2 === 0}>
          <ItemTitle>{ product.type } ({ product.variations.length } variations)</ItemTitle>
          {product.variations.map((variation) => {
            return (
              <Variation key={variation.sku} product={product} variation={variation} />
            )
          })}
        </ItemHolder>
        <div></div>
      </div>
    )
  };

  return (
    <main>
      <Header />
      <section>
        <div style={{height: '1000px'}}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                className="List"
                height={height}
                itemCount={props.products.length}
                itemSize={getItemSize}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      </section>
    </main>
  );
}

Index.getInitialProps = async (env) => {
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
      products
  }
}

export default Index;
