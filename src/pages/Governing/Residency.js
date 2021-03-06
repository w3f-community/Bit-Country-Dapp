/* eslint-disable react/display-name */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button, Col, Divider, Icon, Row, Table } from "antd";
import { fetchAPI } from "../../utils/FetchUtil";
import endpoints from "../../config/endpoints";
import { CountryConnect } from "../../components/HOC/Country/CountryWrapper";
import Notification from "../../utils/Notification";
import Logging from "../../utils/Logging";
import { AuthConnect } from "../../components/HOC/Auth/AuthContext";
import { navigate } from "@reach/router";

function Residency({ countryId, loggedIn }) {
  const [ applications, setApplications ] = useState([]);
  const [ loading, setLoading ] = useState(true);
  const [ processing, setProcessing ] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const response = await fetchAPI(`${endpoints.GET_COUNTRY_RESIDENCY_APPLICATIONS}?countryUid=${countryId}`);

        if (!response?.isSuccess) {
          if (response?.message || response?.json?.message) {
            Notification.displayErrorMessage(
              <FormattedMessage id={response.message || response.json.message} />
            );
    
            throw Error(response.message || response.json.message);
          } else if (response.status == 403) {
            Notification.displayErrorMessage(
              <FormattedMessage
                id="country.stake.residency.notifications.errorUnauthorised"
              />
            );

            throw Error("User isn't authorised to access residency applications");
          }
  
          Notification.displayErrorMessage(
            <FormattedMessage
              id="country.stake.residency.notifications.error"
            />
          );
  
          throw Error("Error while retrieving country applications");
        }

        setApplications(response.applications);
      } catch (error) {
        Logging.Error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const approveResidencyApplication = useCallback(id => {
    (async () => {
      try {
        setProcessing(true);

        const response = await fetchAPI(
          endpoints.ACCEPT_RESIDENCY_APPLICATION, 
          "POST",
          {
            applicationId: id,
            countryUid: countryId,
          }
        );

        if (!response?.isSuccess) {
          if (response?.json?.message) {
            Notification.displayErrorMessage(
              <FormattedMessage
                id={response.json.message}
              />
            );
  
            throw Error(response.json.message);
          }
  
          Notification.displayErrorMessage(
            <FormattedMessage
              id="country.stake.residency.notifications.errorAccept"
            />
          );
  
          throw Error("Error while accepting residency application, please try again later");
        }

        Notification.displaySuccessMessage(
          <FormattedMessage
            id="country.stake.residency.notifications.successAccept"
          />
        );

        setApplications(applications.filter(item => item.id != id));
      } catch (error) {
        Logging.Error(error);
      } finally {
        setProcessing(false);
      }
    })();
  }, [ applications ]);

  const denyResidencyApplication = useCallback((id, reason = "") => {
    (async () => {
      try {
        setProcessing(true);

        const response = await fetchAPI(
          endpoints.REJECT_RESIDENCY_APPLICATION, 
          "POST",
          {
            applicationId: id,
            countryUid: countryId,
            reason: reason
          }
        );

        if (!response?.isSuccess) {
          if (response?.json?.message) {
            Notification.displayErrorMessage(
              <FormattedMessage
                id={response.json.message}
              />
            );
  
            throw Error(response.json.message);
          }
  
          Notification.displayErrorMessage(
            <FormattedMessage
              id="country.stake.residency.notifications.errorDeny"
            />
          );
  
          throw Error("Error while denying residency application, please try again later");
        }

        Notification.displaySuccessMessage(
          <FormattedMessage
            id="country.stake.residency.notifications.successDeny"
          />
        );

        setApplications(applications.filter(item => item.id != id));
      } catch (error) {
        Logging.Error(error);
      } finally {
        setProcessing(false);
      }
    })();
  }, [ applications ]);

  const columns = useMemo(() => ([{
    dataIndex: "id",
    className: "id",
    title: (
      <FormattedMessage
        id="country.stake.residency.table.id"
      />
    )
  }, {
    dataIndex: "applicant.nickName",
    className: "applicant",
    title: (
      <FormattedMessage
        id="country.stake.residency.table.applicant"
      />
    )
  }, {
    dataIndex: "message",
    className: "message",
    title: (
      <FormattedMessage
        id="country.stake.residency.table.message"
      />
    )
  }, {
    dataIndex: "referrer.nickName",
    className: "referrer",
    title: (
      <FormattedMessage
        id="country.stake.residency.table.referrer"
      />
    )
  }, {
    dataIndex: "appliedOn",
    className: "appliedOn",
    render: date => new Date(date).toLocaleString(),
    title: (
      <FormattedMessage
        id="country.stake.residency.table.appliedOn"
      />
    )
  }, {
    dataIndex: "",
    className: "actions",
    render: item => (
      <div>
        <Button loading={processing} onClick={() => approveResidencyApplication(item.id)}>
          <Icon type="check" />
        </Button>
        <Button loading={processing} onClick={() => denyResidencyApplication(item.id)}>
          <Icon type="close" />
        </Button>
      </div>
    ),
  }]), [ approveResidencyApplication, denyResidencyApplication, processing ]);

  if (!loggedIn) {
    navigate("../403");
  }

  return (
    <Col
      id="residency"
      push={4}
      span={16}
    >
      <Row>
        <Col span={24}>
          <h2>
            <FormattedMessage
              id="country.stake.residency.title"
            />
          </h2>
        </Col>
      </Row>
      <Divider />
      <Table
        loading={loading}
        dataSource={applications}
        columns={columns}
        pagination={{ pageSize: 25 }}
        rowClassName={(record, index) => `index-${index}`}
        rowKey={record => record.id}
      />
    </Col>
  );
}

export default AuthConnect(CountryConnect(Residency, true));
