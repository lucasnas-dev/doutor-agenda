import { headers } from "next/headers";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { SubscriptionPlan } from "./_components/subscription-plan";

const SubscriptionPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ✅ Verificação segura
  if (!session?.user) {
    return null; // WithAuthentication vai lidar
  }

  return (
    <WithAuthentication>
      {" "}
      {/* ✅ Remover mustHaveClinic para evitar loops */}
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Assinatura</PageTitle>
            <PageDescription>Gerencie a sua assinatura.</PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent>
          <SubscriptionPlan
            className="w-[350px]"
            active={session.user.plan === "essential"} // ✅ Sem forçar !
            userEmail={session.user.email} // ✅ Sem forçar !
          />
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default SubscriptionPage;
