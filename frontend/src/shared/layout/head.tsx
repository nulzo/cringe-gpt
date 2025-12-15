import { Helmet } from "react-helmet-async";
import { APP_NAME } from "@/configuration/const";
import { useEffect } from "react";

type HeadProps = {
  title?: string;
  description?: string;
};

export const Head = ({ title, description = "" }: HeadProps = {}) => {
  const pageTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <Helmet title={pageTitle} key={pageTitle}>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
};
