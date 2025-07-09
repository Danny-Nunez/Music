import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-0 md:pl-64">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <main className="pt-20">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
