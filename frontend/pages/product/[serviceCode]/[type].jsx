import Link from "next/link";
import Header from "../../../components/header";
import util from 'util'
import fetch from 'isomorphic-unfetch';
import apiUrl from '../../../utils/api-url';
import {
  useRouter
} from 'next/router';
import {
  FixedSizeList as List
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import {
  css,
  Global
} from '@emotion/core';

import styled from '@emotion/styled';

const Product = ({
  product
}) => {
  return (
    <main>
      <Header />
      <section>
        <div>
          <div>{product.type}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {product.variations.map((variation) => {
              const onDemandPrice = variation.offers.find(_ => _.type === 'on-demand')
              const convertibles = variation.offers.filter(_ => _.type === 'reserved' && _.isConvertible)
                .sort((a, b) => {
                  return a.score > b.score ? 1 : -1
                })
              const standards = variation.offers.filter(_ => _.type === 'reserved' && !_.isConvertible)
                .sort((a, b) => {
                  return a.score > b.score ? 1 : -1
                })

              return (
                <div style={{ marginTop: '0.75rem' }} key={variation.sku}>
                  {variation.sku}
                  <div key={variation.sku} style={{ display: 'flex' }}>
                    <table style={{ marginTop: '0.75rem', fontSize: '12px' }}>
                      <tbody>
                        {Object.entries(variation.attributes).map(([key, value]) => {
                          return (
                            <tr key={key}>
                              <td style={{ padding: '0.25rem', color: '#999' }}>{key}</td>
                              <td style={{ padding: '0.25rem', color: '#999' }}>{value}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div style={{ marginLeft: '0.75rem', display: 'flex' }}>
                      <div style={{ marginRight: '0.75rem' }}>
                        {onDemandPrice && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 'bold' }}>
                              On-Demand
                            </div>
                            <table style={{ marginBottom: '0.75rem', fontSize: '12px', width: '100%' }}>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '0.25rem' }}>Hourly</td>
                                  <td style={{ padding: '0.25rem' }}>{onDemandPrice.totalPricePerHour}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div style={{ marginRight: '0.75rem' }}>
                        {standards && standards.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: 12, marginBottom: '0.75rem', fontWeight: 'bold' }}>Standard</div>
                            {standards.map((item) => {
                              return (
                                <div key={item.skus}>
                                  <div style={{ fontSize: 12, marginBottom: '0.75rem 0', fontWeight: 'bold' }}>
                                    {item.purchaseOption} - {item.contractLength}
                                  </div>
                                  <table style={{ marginBottom: '0.75rem', fontSize: '12px' }}>
                                    <tbody>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total Hourly</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPricePerHour}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Reserved Hourly</td>
                                        <td style={{ padding: '0.25rem' }}>{item.reservedPricePerHour}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>On-Demand Hourly</td>
                                        <td style={{ padding: '0.25rem' }}>{item.onDemandPricePerHour}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Upfront</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPriceReserved}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total On Demand</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPriceOnDemand}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total Reserved</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPriceReserved}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPrice}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ marginRight: '0.75rem' }}>
                        {convertibles && convertibles.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: 12, marginBottom: '0.75rem', fontWeight: 'bold' }}>Convertible</div>
                            {convertibles.map((item) => {
                              return (
                                <div key={item.skus}>
                                  <div style={{ fontSize: 12, marginBottom: '0.75rem 0', fontWeight: 'bold' }}>
                                    {item.purchaseOption} - {item.contractLength}
                                  </div>
                                  <table style={{ marginBottom: '0.75rem', fontSize: '12px' }}>
                                    <tbody>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total Hourly</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPricePerHour}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Reserved Hourly</td>
                                        <td style={{ padding: '0.25rem' }}>{item.reservedPricePerHour}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>On-Demand Hourly</td>
                                        <td style={{ padding: '0.25rem' }}>{item.onDemandPricePerHour}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Upfront</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPriceReserved}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total On Demand</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPriceOnDemand}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total Reserved</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPriceReserved}</td>
                                      </tr>
                                      <tr>
                                        <td style={{ padding: '0.25rem' }}>Total</td>
                                        <td style={{ padding: '0.25rem' }}>{item.totalPrice}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

Product.getInitialProps = async (env) => {
  const response = await fetch(env.apiHost, {
    method: 'POST',
    body: JSON.stringify({
      'i': 'ok',
      'action': 'product',
      'params': {
        'type': env.query.type,
        'code': env.query.serviceCode
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const product = await response.json()

  return {
    serviceCode: env.query.name,
    type: env.query.type,
    product
  }
}

export default Product;
